import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  Grid,
  EmptyState,
  Thumbnail,
  InlineStack,
  Spinner,
  Badge,
  Modal
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback } from "react";

// 1. Loader: Fetch images from SaaS API
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Retrieve SaaS Token
  const settings = await prisma.storeSettings.findUnique({
    where: { shop },
  });

  if (!settings || !settings.apiToken) {
    return json({
      error: "missing_token",
      images: []
    });
  }

  // Fetch images from SaaS
  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") || "";

    const response = await fetch(`https://studio.moreira.uy/api/wp/images?cursor=${cursor}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${settings.apiToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return json({ error: "api_error", images: [] });
    }

    const data = await response.json();
    return json({
      error: null,
      images: data.items || [],
      nextCursor: data.nextCursor || null
    });

  } catch (error) {
    console.error("Fetch Error:", error);
    return json({ error: "network_error", images: [] });
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const intent = formData.get("intent");
  if (intent !== "import") return json({ error: "invalid_intent" });

  const productId = formData.get("productId");
  const urlsString = formData.get("urls");

  if (!productId || !urlsString) {
    return json({ error: "missing_data" });
  }

  const urls = JSON.parse(urlsString);

  // For each URL, we tell Shopify to import it into the product's media
  const mutations = urls.map(url => {
    return admin.graphql(
      `#graphql
      mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
        productCreateMedia(media: $media, productId: $productId) {
          mediaUserErrors {
            field
            message
          }
          media {
            alt
            mediaContentType
            status
          }
        }
      }`,
      {
        variables: {
          productId: productId,
          media: [
            {
              alt: "AI Generated Fashion Image",
              mediaContentType: "IMAGE",
              originalSource: url,
            }
          ]
        }
      }
    );
  });

  try {
    await Promise.all(mutations);
    return json({ success: true, count: urls.length });
  } catch (err) {
    console.error("GraphQL Error importing media", err);
    return json({ error: "import_failed" });
  }
};

export default function Index() {
  const { error, images, nextCursor } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const submit = useSubmit();

  const [activeItems, setActiveItems] = useState(images || []);
  const [cursor, setCursor] = useState(nextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Selection state
  const [selectedItems, setSelectedItems] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // Modal Product Picker state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check fetcher data for pagination
  if (fetcher.data && fetcher.data.images && isLoadingMore) {
    setActiveItems([...activeItems, ...fetcher.data.images]);
    setCursor(fetcher.data.nextCursor);
    setIsLoadingMore(false);
  }

  const loadMore = () => {
    if (!cursor) return;
    setIsLoadingMore(true);
    fetcher.load(`?index&cursor=${cursor}`);
  };

  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === activeItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(activeItems.map(i => i.id));
    }
  };

  const handleImportClick = () => {
    // Open product picker
    openProductPicker();
  };

  const openProductPicker = async () => {
    // In a real scenario, we use Shopify App Bridge Resource Picker
    // For now, simulated as a basic flow.
    const selected = await shopify.resourcePicker({ type: 'product', action: 'select', multiple: false });

    if (selected && selected.length > 0) {
      const productId = selected[0].id;

      // Find URLs for the selected items
      const urlsToImport = selectedItems.map(id => {
        const item = activeItems.find(i => i.id === id);
        return item ? item.downloadUrl : null;
      }).filter(Boolean);

      if (urlsToImport.length > 0) {
        shopify.toast.show(`Importando ${urlsToImport.length} imágenes...`);

        submit(
          {
            intent: "import",
            productId: productId,
            urls: JSON.stringify(urlsToImport)
          },
          { method: "post" }
        );

        setSelectedItems([]);
      }
    }
  };

  if (error === "missing_token") {
    return (
      <Page>
        <TitleBar title="Galería AI" />
        <Layout>
          <Layout.Section>
            <Card>
              <EmptyState
                heading="Configuración Incompleta"
                action={{ content: 'Ir a Configuración', url: '/app/additional' }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Necesitas ingresar tu Token de Studio Moreira para ver tus imágenes generadas.</p>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page fullWidth>
      <TitleBar title="Galería AI">
        <button variant="primary" onClick={handleImportClick} disabled={selectedItems.length === 0}>
          Importar Seleccionadas ({selectedItems.length})
        </button>
      </TitleBar>
      <Layout>
        <Layout.Section>

          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h2">Tus imágenes recientes</Text>
              <Button onClick={selectAll}>
                {selectedItems.length === activeItems.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
              </Button>
            </InlineStack>

            {activeItems.length === 0 && !isLoadingMore ? (
              <Card>
                <EmptyState heading="No hay imágenes" image="">
                  <p>No se encontraron imágenes generadas en tu cuenta.</p>
                </EmptyState>
              </Card>
            ) : (
              <Grid>
                {activeItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  return (
                    <Grid.Cell key={item.id} columnSpan={{ xs: 6, sm: 4, md: 3, lg: 2, xl: 2 }}>
                      <div onClick={() => toggleSelection(item.id)} style={{ cursor: 'pointer', outline: isSelected ? '3px solid #008060' : '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                        <img
                          src={item.thumbUrl}
                          alt={item.name}
                          style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ padding: '12px', background: '#fff' }}>
                          <Text variant="bodySm" fontWeight="bold" truncate>{item.name}</Text>
                          <Text variant="bodyXs" color="subdued">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </div>
                      </div>
                    </Grid.Cell>
                  );
                })}
              </Grid>
            )}

            {cursor && (
              <InlineStack align="center">
                <Button onClick={loadMore} loading={isLoadingMore}>Cargar Más</Button>
              </InlineStack>
            )}

          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

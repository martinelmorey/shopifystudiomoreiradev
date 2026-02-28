import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  TextField,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// 1. Loader: Cargar el token guardado cuando el usuario entra a la página
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await prisma.storeSettings.findUnique({
    where: { shop },
  });

  return json({ apiToken: settings?.apiToken || "" });
};

// 2. Action: Guardar el token cuando el usuario envía el formulario
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const apiToken = formData.get("apiToken");

  await prisma.storeSettings.upsert({
    where: { shop },
    update: { apiToken },
    create: { shop, apiToken },
  });

  return json({ success: true });
};

export default function AdditionalPage() {
  const { apiToken: initialToken } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [apiToken, setApiToken] = useState(initialToken);
  const isSaving = navigation.state === "submitting";

  const handleSave = () => {
    submit({ apiToken }, { method: "post" });
  };

  return (
    <Page>
      <TitleBar title="Configuración de IA" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Conexión con Studio Moreira AI
              </Text>
              <Text as="p" variant="bodyMd">
                Para poder importar tus imágenes generadas con IA directamente a tus productos de Shopify, necesitas ingresar tu Token de Integración privado.
              </Text>

              <TextField
                label="API Token"
                value={apiToken}
                onChange={setApiToken}
                autoComplete="off"
                helpText="Puedes encontrar este Token en tu panel de usuario de Studio Moreira."
                type="password"
              />

              {actionData?.success && (
                <Text as="p" tone="success">
                  ¡Token guardado exitosamente! Ya puedes ir a la Galería.
                </Text>
              )}

              <Button primary onClick={handleSave} loading={isSaving}>
                Guardar Configuración
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Recursos
              </Text>
              <List>
                <List.Item>
                  <Link url="https://studio.moreira.uy" target="_blank">
                    Ir a la App de Generación
                  </Link>
                </List.Item>
                <List.Item>
                  <Link url="https://dev.moreira.uy/contact" target="_blank">
                    Soporte Técnico
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

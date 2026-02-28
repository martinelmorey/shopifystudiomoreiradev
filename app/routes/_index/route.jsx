import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>
          Studio <span className={styles.brandGreen}>Moreira</span>
        </h1>
        <p className={styles.text}>
          Integra la potencia de la Inteligencia Artificial directamente en tu catálogo de Shopify.
        </p>

        {showForm && (
          <div className={styles.formBox}>
            <Form className={styles.form} method="post" action="/auth/login">
              <label className={styles.label}>
                <span className={styles.labelSpan}>Tienda Shopify</span>
                <input
                  className={styles.input}
                  type="text"
                  name="shop"
                  placeholder="ejemplo.myshopify.com"
                  required
                />
                <span className={styles.inputHint}>Ingresa tu dominio .myshopify.com sin "https://"</span>
              </label>
              <button className={styles.button} type="submit">
                Conectar Tienda
              </button>
            </Form>
          </div>
        )}

        <ul className={styles.list}>
          <li className={styles.listItem}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <span className={styles.featureTitle}>Rápido</span>
              <p className={styles.featureDesc}>Genera imágenes en segundos para tus productos.</p>
            </div>
          </li>
          <li className={styles.listItem}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div>
              <span className={styles.featureTitle}>Catálogo Sync</span>
              <p className={styles.featureDesc}>Conexión directa con tus productos.</p>
            </div>
          </li>
          <li className={styles.listItem}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <span className={styles.featureTitle}>Imágenes AI</span>
              <p className={styles.featureDesc}>Estudios virtuales de alta calidad.</p>
            </div>
          </li>
          <li className={styles.listItem}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <div>
              <span className={styles.featureTitle}>Configurable</span>
              <p className={styles.featureDesc}>Ajusta cada detalle fácilmente.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

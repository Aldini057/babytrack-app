package com.babytrack.app;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintJob;
import android.print.PrintManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BabyPrint")
public class BabyPrintPlugin extends Plugin {

    private WebView printWebView;

    @PluginMethod
    public void printHtml(PluginCall call) {
        final String html = call.getString("html");
        if (html == null || html.trim().isEmpty()) {
            call.reject("Contenido HTML vacío para imprimir.");
            return;
        }

        String rawJobName = call.getString("jobName", "BabyTrack-Documento");
        final String safeJobName = (rawJobName == null || rawJobName.trim().isEmpty())
            ? "BabyTrack-Documento"
            : rawJobName.trim().replaceAll("[\\\\/:*?\"<>|]", "-");

        final AppCompatActivity activity = getActivity();
        if (activity == null || activity.isFinishing()) {
            call.reject("Actividad de Android no disponible para imprimir.");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                if (printWebView != null) {
                    try {
                        printWebView.stopLoading();
                        printWebView.destroy();
                    } catch (Exception ignored) {}
                    printWebView = null;
                }

                WebView webView = new WebView(activity);
                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(false);
                settings.setLoadsImagesAutomatically(true);
                settings.setDomStorageEnabled(false);
                settings.setAllowFileAccess(false);
                settings.setDefaultTextEncodingName("UTF-8");

                final boolean[] hasStartedPrint = { false };

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        return true;
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (hasStartedPrint[0]) {
                            return;
                        }
                        hasStartedPrint[0] = true;

                        new Handler(Looper.getMainLooper()).postDelayed(() -> {
                            AppCompatActivity currentAct = getActivity();
                            if (currentAct == null || currentAct.isFinishing()) {
                                call.reject("La pantalla se cerró antes de abrir el gestor de impresión.");
                                return;
                            }
                            try {
                                PrintManager printManager = (PrintManager) currentAct.getSystemService(Context.PRINT_SERVICE);
                                if (printManager == null) {
                                    call.reject("Servicio PrintManager no disponible en este dispositivo.");
                                    return;
                                }

                                PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(safeJobName);
                                PrintAttributes attributes = new PrintAttributes.Builder()
                                    .setMediaSize(PrintAttributes.MediaSize.NA_LETTER)
                                    .setResolution(new PrintAttributes.Resolution("pdf", "PDF", 300, 300))
                                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                    .build();

                                PrintJob printJob = printManager.print(safeJobName, adapter, attributes);

                                JSObject ret = new JSObject();
                                ret.put("ok", true);
                                ret.put("jobName", safeJobName);
                                ret.put("started", printJob != null);
                                call.resolve(ret);
                            } catch (Exception ex) {
                                call.reject("Error al iniciar PrintManager: " + ex.getMessage(), ex);
                            }
                        }, 180);
                    }
                });

                printWebView = webView;
                webView.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
            } catch (Exception e) {
                call.reject("No se pudo preparar el documento PDF: " + e.getMessage(), e);
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        final WebView viewToDestroy = printWebView;
        printWebView = null;
        if (viewToDestroy != null) {
            AppCompatActivity activity = getActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    try {
                        viewToDestroy.destroy();
                    } catch (Exception ignored) {}
                });
            }
        }
        super.handleOnDestroy();
    }
}

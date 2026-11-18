package com.babytrack.app;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Scope;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "CoupleDrive")
public class CoupleDrivePlugin extends Plugin {

    private static final String DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
    private ActivityResultLauncher<IntentSenderRequest> authResolutionLauncher;
    private String pendingAuthCallId;

    @Override
    public void load() {
        authResolutionLauncher = bridge.registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(),
            result -> {
                PluginCall savedCall = pendingAuthCallId != null ? bridge.getSavedCall(pendingAuthCallId) : null;
                pendingAuthCallId = null;
                if (savedCall == null) {
                    return;
                }
                bridge.releaseCall(savedCall);

                if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
                    savedCall.reject("Autorización cancelada por el usuario.", "CANCELED");
                    return;
                }

                try {
                    AuthorizationResult authResult = Identity
                        .getAuthorizationClient(getActivity())
                        .getAuthorizationResultFromIntent(result.getData());
                    resolveWithAuthResult(savedCall, authResult);
                } catch (ApiException e) {
                    savedCall.reject(mapApiErrorMessage(e), String.valueOf(e.getStatusCode()));
                } catch (Exception e) {
                    savedCall.reject("No se pudo completar la autorización de Google Drive: " + e.getMessage());
                }
            }
        );
    }

    @PluginMethod
    public void authorizeDrive(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Actividad Android no disponible.");
            return;
        }

        List<Scope> scopes = Collections.singletonList(new Scope(DRIVE_FILE_SCOPE));
        AuthorizationRequest request = AuthorizationRequest.builder()
            .setRequestedScopes(scopes)
            .build();

        Identity.getAuthorizationClient(activity)
            .authorize(request)
            .addOnSuccessListener(authResult -> {
                if (authResult.hasResolution()) {
                    PendingIntent pendingIntent = authResult.getPendingIntent();
                    if (pendingIntent == null) {
                        call.reject("Google no devolvió pantalla de consentimiento.");
                        return;
                    }
                    bridge.saveCall(call);
                    pendingAuthCallId = call.getCallbackId();
                    try {
                        IntentSenderRequest intentSenderRequest = new IntentSenderRequest.Builder(
                            pendingIntent.getIntentSender()
                        ).build();
                        authResolutionLauncher.launch(intentSenderRequest);
                    } catch (Exception e) {
                        bridge.releaseCall(call);
                        pendingAuthCallId = null;
                        call.reject("No se pudo abrir el diálogo de Google: " + e.getMessage());
                    }
                } else {
                    resolveWithAuthResult(call, authResult);
                }
            })
            .addOnFailureListener(e -> {
                if (e instanceof ApiException) {
                    ApiException apiEx = (ApiException) e;
                    call.reject(mapApiErrorMessage(apiEx), String.valueOf(apiEx.getStatusCode()));
                } else {
                    call.reject("Error al conectar con Google Drive: " + e.getMessage());
                }
            });
    }

    @PluginMethod
    public void signOutDrive(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    private void resolveWithAuthResult(PluginCall call, AuthorizationResult authResult) {
        String accessToken = authResult != null ? authResult.getAccessToken() : null;
        if (accessToken == null || accessToken.isEmpty()) {
            call.reject("Google no devolvió un token de acceso válido para Drive.");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("accessToken", accessToken);
        JSArray granted = new JSArray();
        if (authResult.getGrantedScopes() != null) {
            for (String scope : authResult.getGrantedScopes()) {
                granted.put(scope);
            }
        }
        ret.put("grantedScopes", granted);
        call.resolve(ret);
    }

    private String mapApiErrorMessage(ApiException e) {
        int code = e.getStatusCode();
        if (code == CommonStatusCodes.DEVELOPER_ERROR) {
            return "Falta registrar el cliente OAuth Android (com.babytrack.app + huella SHA-1) en Google Cloud Console (error 10).";
        }
        if (code == CommonStatusCodes.CANCELED) {
            return "Autorización cancelada por el usuario.";
        }
        if (code == CommonStatusCodes.NETWORK_ERROR) {
            return "Sin conexión a internet para verificar tu cuenta de Google.";
        }
        return "Error de Google Drive OAuth (" + code + "): " + e.getMessage();
    }
}

package com.babytrack.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CoupleDrivePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

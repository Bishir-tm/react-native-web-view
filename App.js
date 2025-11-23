import React, { useEffect, useState } from "react";
import { StyleSheet, View, SafeAreaView, StatusBar, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { Camera } from "expo-camera";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const webViewRef = React.useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");

      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "This app needs camera access to scan product barcodes. Please enable camera permissions in your device settings.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    console.log("Message from WebView:", message);

    // Handle any messages from your web app if needed
    if (message === "REQUEST_CAMERA_PERMISSION") {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");

        // Send permission status back to WebView
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new CustomEvent('cameraPermissionResult', { 
            detail: { granted: ${status === "granted"} } 
          }));
        `);
      })();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: "https://bishir-tm.github.io/nutrition-tracker/" }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        onMessage={handleWebViewMessage}
        // Critical: Allow camera access in WebView
        allowsMediaCapture={true}
        // For Android - grant media permissions automatically
        androidLayerType="hardware"
        mixedContentMode="always"
        onPermissionRequest={(request) => {
          // Automatically grant camera permission to WebView
          if (hasPermission) {
            request.grant(request.resources);
          } else {
            request.deny();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
});

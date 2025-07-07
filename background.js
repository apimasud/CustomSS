// Define base resolution and delay for ratio calculation
const BASE_RESOLUTION = {
  width: 1920,
  height: 1080,
  delay: 1000, // 1 second base delay for FHD
};

// Predefined resolution delays (in milliseconds)
const RESOLUTION_DELAYS = {
  "1920x1080": 1000, // 1 second for FHD
  "2560x1440": 2000, // 2 seconds for QHD
  "3840x2160": 3000, // 3 seconds for 4K
  "5120x2880": 4000, // 4 seconds for 5K
  "6016x3384": 5000, // 5 seconds for 6K
  "7680x4320": 6000, // 6 seconds for 7K
  "8192x4320": 7000, // 7 seconds for 8K
};

// Listen for shortcut commands
chrome.commands.onCommand.addListener((command) => {
  if (command === "capture-screenshot") {
    console.log("Shortcut triggered: Capturing screenshot.");
    takeHighResolutionScreenshot();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "capture-screenshot") {
    const width = message.width || 1920;
    const height = message.height || 1080;
    const delay = message.delay || 0; // Timer delay in milliseconds
    takeHighResolutionScreenshot(width, height, delay);
    sendResponse({ status: "Screenshot command received" });
  }
});

// Calculate dynamic delay based on resolution
function calculateDynamicDelay(width, height) {
  const customPixels = width * height;
  const basePixels = BASE_RESOLUTION.width * BASE_RESOLUTION.height;
  const ratio = customPixels / basePixels;
  const delay = Math.round(BASE_RESOLUTION.delay * Math.sqrt(ratio));
  const minDelay = 1000;
  const maxDelay = 10000;
  return Math.min(Math.max(delay, minDelay), maxDelay);
}

// Get delay for a specific resolution
function getDelayForResolution(width, height) {
  const resolution = `${width}x${height}`;
  return RESOLUTION_DELAYS[resolution] || calculateDynamicDelay(width, height);
}

// Capture screenshot with optional delay
function takeHighResolutionScreenshot(width = 1920, height = 1080, delay = 0) {
  setTimeout(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }

      const tab = tabs[0];
      const tabUrl = tab.url || "";

      // Check if the tab URL is a valid web page
      if (tabUrl.startsWith("chrome-extension://")) {
        console.error("Cannot capture screenshot: Active tab is an extension page.");
        return;
      }

      const tabId = tab.id;
      attachDebuggerAndCapture(tabId, width, height);
    });
  }, delay); // Apply the delay here
}

// Attach debugger and capture screenshot
function attachDebuggerAndCapture(tabId, width, height) {
  chrome.debugger.attach({ tabId }, "1.3", () => {
    if (chrome.runtime.lastError) {
      console.error("Debugger attach failed:", chrome.runtime.lastError.message);
      return;
    }
    console.log("Debugger attached.");

    chrome.debugger.sendCommand({ tabId }, "Emulation.setDeviceMetricsOverride", {
      width: width,
      height: height,
      deviceScaleFactor: 1,
      mobile: false,
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to set device metrics:", chrome.runtime.lastError.message);
        chrome.debugger.detach({ tabId });
        return;
      }

      const delay = getDelayForResolution(width, height);
      console.log(`Using ${delay}ms delay for resolution ${width}x${height}`);

      setTimeout(() => {
        chrome.debugger.sendCommand({ tabId }, "Page.captureScreenshot", {}, (result) => {
          if (chrome.runtime.lastError) {
            console.error("Screenshot capture failed:", chrome.runtime.lastError.message);
            chrome.debugger.detach({ tabId });
            return;
          }

          const screenshotUrl = `data:image/png;base64,${result.data}`;
          chrome.downloads.download({ url: screenshotUrl, filename: "screenshot.png" }, () => {
            if (chrome.runtime.lastError) {
              console.error("Download failed:", chrome.runtime.lastError.message);
            } else {
              console.log("Screenshot saved successfully.");
            }
            chrome.debugger.detach({ tabId });
          });
        });
      }, delay);
    });
  });
}
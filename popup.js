document.addEventListener('DOMContentLoaded', function () {
    const resolutionButtons = document.querySelectorAll(".resolution-btn");
    const delayInput = document.getElementById("delay");
    const captureButton = document.getElementById("captureBtn");
    const statusMessage = document.getElementById("statusMessage");
  
    let selectedWidth = 1920; // Default width
    let selectedHeight = 1080; // Default height
  
    // Add click event listeners to resolution buttons
    resolutionButtons.forEach(button => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        resolutionButtons.forEach(btn => btn.classList.remove("active"));
  
        // Add active class to the clicked button
        button.classList.add("active");
  
        // Set selected resolution
        selectedWidth = button.dataset.width;
        selectedHeight = button.dataset.height;
      });
    });
  
    // Capture screenshot handler
    captureButton.addEventListener("click", () => {
      const delay = parseInt(delayInput.value) || 0; // Default to 0 if empty
  
      // Validate the inputs
      if (selectedWidth && selectedHeight && !isNaN(selectedWidth) && !isNaN(selectedHeight)) {
        captureButton.disabled = true;
        captureButton.textContent = "Capturing...";
  
        chrome.runtime.sendMessage(
          {
            command: "capture-screenshot",
            width: parseInt(selectedWidth),
            height: parseInt(selectedHeight),
            delay: delay * 1000 // Convert seconds to milliseconds
          },
          (response) => {
            captureButton.disabled = false;
            captureButton.textContent = "Capture";
  
            // Show success message
            statusMessage.textContent = "Screenshot captured!";
            statusMessage.style.display = "block";
  
            // Hide the message after 2 seconds
            setTimeout(() => {
              statusMessage.style.display = "none";
            }, 2000);
          }
        );
      } else {
        statusMessage.textContent = "Invalid resolution!";
        statusMessage.style.color = "#dc3545"; // Red for error
        statusMessage.style.display = "block";
  
        // Hide the message after 2 seconds
        setTimeout(() => {
          statusMessage.style.display = "none";
        }, 2000);
      }
    });
  });
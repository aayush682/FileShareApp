// Get the necessary elements from the DOM
const dropZone = document.querySelector(".drop-zone");
const fileInput = document.querySelector("#fileInput");
const browseBtn = document.querySelector("#browseBtn");

const bgProgress = document.querySelector(".bg-progress");
const progressPercent = document.querySelector("#progressPercent");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.querySelector(".progress-bar");
const status = document.querySelector(".status");

const sharingContainer = document.querySelector(".sharing-container");
const copyURLBtn = document.querySelector("#copyURLBtn");
const fileURL = document.querySelector("#fileURL");
const emailForm = document.querySelector("#emailForm");

const toast = document.querySelector(".toast");

// Set the base URL and upload URLs
const baseURL = "https://fileshare-f04f.onrender.com";
const uploadURL = `${baseURL}/api/files`;
const emailURL = `${baseURL}/api/files/send`;

// Set the maximum allowed file size
const maxAllowedSize = 100 * 1024 * 1024; //100mb

// Add a click event listener to the browse button to trigger file input click
browseBtn.addEventListener("click", () => {
    fileInput.click();
});

// Add a drop event listener to the drop zone to handle file dropping
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 1) {
        // Check if the file size is within the allowed limit
        if (files[0].size < maxAllowedSize) {
            fileInput.files = files;
            uploadFile();
        } else {
            showToast("Max file size is 100MB");
        }
    } else if (files.length > 1) {
        showToast("You can't upload multiple files");
    }
    dropZone.classList.remove("dragged");
});

// Add a dragover event listener to the drop zone to handle file dragging
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragged");
});

// Add a dragleave event listener to the drop zone to handle the end of dragging
dropZone.addEventListener("dragleave", (e) => {
    dropZone.classList.remove("dragged");
    console.log("drag ended");
});

// Add a change event listener to the file input to handle file selection
fileInput.addEventListener("change", () => {
    // Check if the file size is within the allowed limit
    if (fileInput.files[0].size > maxAllowedSize) {
        showToast("Max file size is 100MB");
        fileInput.value = ""; // reset the input
        return;
    }
    uploadFile();
});

// Add a click event listener to the copy URL button to copy the file URL to the clipboard
copyURLBtn.addEventListener("click", () => {
    fileURL.select();
    document.execCommand("copy");
    showToast("Copied to clipboard");
});

// Add a click event listener to the file URL input to select its content when clicked
fileURL.addEventListener("click", () => {
    fileURL.select();
});

// Function to handle file upload
const uploadFile = () => {
    console.log("file added uploading");

    const files = fileInput.files;
    const formData = new FormData();
    formData.append("myfile", files[0]);

    // Show the progress bar container
    progressContainer.style.display = "block";

    // Create and send an XMLHttpRequest to upload the file
    const xhr = new XMLHttpRequest();

    // Listen for upload progress
    xhr.upload.onprogress = function (event) {
        // Calculate and display the upload progress percentage
        let percent = Math.round((100 * event.loaded) / event.total);
        progressPercent.innerText = percent;
        const scaleX = `scaleX(${percent / 100})`;
        bgProgress.style.transform = scaleX;
        progressBar.style.transform = scaleX;
    };

    // Handle upload error
    xhr.upload.onerror = function () {
        showToast(`Error in upload.`);
        fileInput.value = ""; // Reset the input
    };

    // Listen for response which will give the file URL
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            onFileUploadSuccess(xhr.responseText);
        }
    };

    xhr.open("POST", uploadURL);
    xhr.send(formData);
};

// Function to handle successful file upload
const onFileUploadSuccess = (res) => {
    fileInput.value = ""; // Reset the input
    status.innerText = "Uploaded";

    // Enable the send button in the email form
    emailForm[2].removeAttribute("disabled");
    emailForm[2].innerText = "Send";
    progressContainer.style.display = "none"; // Hide the progress container

    const { file: url } = JSON.parse(res);
    console.log(url);
    sharingContainer.style.display = "block";
    fileURL.value = url;
};

// Add a submit event listener to the email form to handle email sending
emailForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Stop form submission

    // Disable the send button
    emailForm[2].setAttribute("disabled", "true");
    emailForm[2].innerText = "Sending";

    const url = fileURL.value;

    // Create the form data to be sent in the request body
    const formData = {
        uuid: url.split("/").splice(-1, 1)[0],
        emailTo: emailForm.elements["to-email"].value,
        emailFrom: emailForm.elements["from-email"].value,
    };
    console.log(formData);
    fetch(emailURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                showToast("Email Sent");
                sharingContainer.style.display = "none"; // Hide the sharing container
            }
        });
});

let toastTimer;

// Function to display a toast message
const showToast = (msg) => {
    clearTimeout(toastTimer);
    toast.innerText = msg;
    toast.classList.add("show");
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
};
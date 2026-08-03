document.addEventListener("DOMContentLoaded", () => {
  // Live profile photo uploader feature
  const photoInput = document.getElementById("photoInput");
  const profileImage = document.getElementById("profileImage");

  if (photoInput && profileImage) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          alert("Please select a valid image file.");
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          profileImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href && href !== "#") {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: "smooth"
          });
        }
      }
    });
  });

  // Contact form submission handling
  const contactForm = document.getElementById("contactForm");
  const contactStatus = document.getElementById("contactStatus");

  if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("contactName");
      const emailInput = document.getElementById("contactEmail");
      const messageInput = document.getElementById("contactMessage");

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const message = messageInput ? messageInput.value.trim() : "";

      if (!name || !email || !message) {
        contactStatus.textContent = "Please fill in all fields.";
        contactStatus.className = "contact-status error";
        return;
      }

      contactStatus.textContent = "Thank you for your message, " + name + "! I will get back to you soon.";
      contactStatus.className = "contact-status success";

      contactForm.reset();

      setTimeout(() => {
        contactStatus.textContent = "";
        contactStatus.className = "contact-status";
      }, 5000);
    });
  }
});

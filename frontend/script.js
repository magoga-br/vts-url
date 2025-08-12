function copyToClipboard(text, element) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = element.textContent;
      element.textContent = "Copiado!";
      setTimeout(() => {
        element.textContent = originalText;
      }, 2000);
    })
    .catch((err) => {
      console.error("Erro ao copiar URL: ", err);
    });
}

document
  .getElementById("shorten-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const originalUrl = document.getElementById("url-input").value;
    const resultDiv = document.getElementById("result");
    resultDiv.textContent = "Encurtando...";

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl }),
      });
      const data = await response.json();
      if (response.ok) {
        const shortUrl = `${window.location.origin}/${data.shortUrl}`;
        resultDiv.innerHTML = `URL encurtada: <a href="#" onclick="copyToClipboard('${shortUrl}', this); return false;">${shortUrl}</a>`;
      } else {
        const errorMessage = data.errors
          ? data.errors[0].message
          : "Erro ao encurtar a URL.";
        resultDiv.textContent = errorMessage;
      }
    } catch (err) {
      resultDiv.textContent = "Erro de conexão com o servidor.";
    }
  });

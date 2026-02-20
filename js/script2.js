const input = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const btn = document.getElementById("enviar");
const loading = document.getElementById("loading");

input.onchange = () => {
  fileName.textContent = input.files[0]?.name || "Nenhum arquivo selecionado";
};

btn.onclick = async () => {

  const file = input.files[0];

  if (!file) {
    alert("Selecione um arquivo");
    return;
  }

  loading.style.display = "block";

  const formData = new FormData();
  formData.append("file", file);

  try {

    const res = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("Erro no servidor");
    }

    const data = await res.json();

    window.location.href = `/app/wrapped.html?id=${data.id}`;

  } catch (err) {

    loading.textContent = "Erro ao processar arquivo 😢";
    console.error(err);

  }
};

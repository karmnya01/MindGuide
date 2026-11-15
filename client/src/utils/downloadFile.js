import axios from "axios";

export const downloadFile = async (url) => {
  const { data } = await axios.get(url, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = decodeURIComponent(
    new URL(url, axios.defaults.baseURL).pathname.split("/").pop() || "download"
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

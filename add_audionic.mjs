async function addProduct() {
  try {
    // 1. Create Product
    const prodRes = await fetch("http://localhost:3000/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Hammer 110 Ultra On-Ear Headphone",
        brand: "Audionic",
        description: "High-quality on-ear headphone with deep bass.",
        category: "Audio",
        media: "https://drive.google.com/file/d/1FOFAJqNc661yhdIqbZFsXTOQltwRk4yo/view?usp=drive_link"
      })
    });
    const prodData = await prodRes.json();
    if (!prodRes.ok) throw new Error("Product creation failed: " + JSON.stringify(prodData));
    console.log("Product Created:", prodData);

    const productId = prodData.productId;

    // 2. Create Variant
    const varRes = await fetch("http://localhost:3000/api/admin/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: productId,
        sku: "AUD-HAM-110",
        price: 49.99,
        currency: "USD",
        color: "Black",
        imageUrl: "https://drive.google.com/file/d/1FOFAJqNc661yhdIqbZFsXTOQltwRk4yo/view?usp=drive_link",
        initialStock: 100
      })
    });
    const varData = await varRes.json();
    if (!varRes.ok) throw new Error("Variant creation failed: " + JSON.stringify(varData));
    console.log("Variant Created:", varData);

  } catch (err) {
    console.error(err);
  }
}

addProduct();

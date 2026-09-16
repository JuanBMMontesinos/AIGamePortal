async function runTests() {
  try {
    const [jogosRes, gtaRes, eldenRes] = await Promise.all([
      fetch("http://localhost:3005/jogos"),
      fetch("http://localhost:3005/jogos/gta-6"),
      fetch("http://localhost:3005/jogos/elden-ring")
    ]);

    console.log("Status /jogos:", jogosRes.status);
    console.log("Status /jogos/gta-6:", gtaRes.status);
    console.log("Status /jogos/elden-ring:", eldenRes.status);

    const jogosHtml = await jogosRes.text();
    const gtaHtml = await gtaRes.text();
    const eldenHtml = await eldenRes.text();

    console.log("\n=== TESTES /jogos ===");
    console.log("Contém 'Grand Theft Auto VI'?", jogosHtml.includes("Grand Theft Auto VI"));
    console.log("Contém 'Elden Ring'?", jogosHtml.includes("Elden Ring"));
    console.log("Contém 'Monster Hunter Wilds'?", jogosHtml.includes("Monster Hunter Wilds"));
    console.log("Contém link para /jogos no header?", jogosHtml.includes('href="/jogos"'));

    console.log("\n=== TESTES /jogos/gta-6 ===");
    console.log("Contém Schema VideoGame?", gtaHtml.includes('"VideoGame"'));
    console.log("Contém Schema BreadcrumbList?", gtaHtml.includes('"BreadcrumbList"'));
    console.log("Contém Ficha Técnica Oficial?", gtaHtml.includes("Ficha Técnica Oficial"));
    console.log("Contém Linha do Tempo de Notícias?", gtaHtml.includes("Linha do Tempo de Notícias"));
    console.log("Contém Onde Comprar?", gtaHtml.includes("Onde Comprar"));
    console.log("Contém Rockstar Games?", gtaHtml.includes("Rockstar Games"));

    console.log("\n=== TESTES /jogos/elden-ring ===");
    console.log("Contém Metacritic 96?", eldenHtml.includes("96"));
    console.log("Contém FromSoftware?", eldenHtml.includes("FromSoftware"));
    console.log("Contém matéria na timeline?", eldenHtml.includes("30 milhões de cópias"));
  } catch (err) {
    console.error("Erro no teste:", err);
  }
}

runTests();

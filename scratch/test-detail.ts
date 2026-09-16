import { getGameHubBySlug, getPostsByGameHub } from "../lib/data/api";
import { getActiveAffiliateProducts } from "../lib/data/affiliates";

async function test() {
  try {
    console.log("Fetching hub...");
    const hub = await getGameHubBySlug("gta-6");
    console.log("Hub:", hub?.name);
    if (!hub) throw new Error("Hub not found");

    console.log("Fetching posts for hub...");
    const posts = await getPostsByGameHub(hub.id, 50);
    console.log("Posts count:", posts.length);

    console.log("Fetching affiliates...");
    const affs = await getActiveAffiliateProducts();
    console.log("Affiliates count:", affs.length);

    console.log("All data fetched successfully!");
  } catch (err) {
    console.error("Caught error in test:", err);
  }
}

test();

// Keep this module free of Three.js so assets can download while the renderer loads.
export async function loadTwinAssets(twin, signal) {
  const modelURL = new URL(twin.model, document.baseURI);
  const motionURL = new URL(twin.motion, document.baseURI);
  async function fetchAsset(url, type) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Replay asset could not load (${response.status}).`);
    return response[type]();
  }
  const metadataRequest = fetchAsset(motionURL, 'json');
  const posesRequest = metadataRequest.then(metadata =>
    fetchAsset(new URL(metadata.poseFile, motionURL), 'arrayBuffer'));
  const [modelBuffer, metadata, buffer] = await Promise.all([
    fetchAsset(modelURL, 'arrayBuffer'), metadataRequest, posesRequest,
  ]);
  return { modelBuffer, metadata, buffer };
}

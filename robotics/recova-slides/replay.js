import * as THREE from 'three';

// The camera has one frame per action sample. Its presentation timeline is
// uniform, while the original action timestamps have small timing variations.
export function videoToStateTime(time, video) {
  const frame = Math.max(0, Math.min(video.frameCount, time * video.fps));
  const first = Math.min(Math.floor(frame), video.frameCount - 1);
  const fraction = frame - first;
  return video.sourceTimes[first] + (video.sourceTimes[first + 1] - video.sourceTimes[first]) * fraction;
}

export function stateInterval(times, time) {
  if (time <= times[0]) return [0, 0, 0];
  const last = times.length - 1;
  if (time >= times[last]) return [last, last, 0];
  let low = 0, high = last;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (times[middle] <= time) low = middle; else high = middle;
  }
  return [low, high, (time - times[low]) / (times[high] - times[low])];
}

export function createMotionPlayer(root, metadata, poses) {
  const { nodes: names, stateTimes, video } = metadata;
  const increasing = values => Array.isArray(values) && values.length > 1 && values.every((value, index) => Number.isFinite(value) && (!index || value > values[index - 1]));
  if (metadata.version !== 1 || !Array.isArray(names) || !names.length || !increasing(stateTimes) ||
      !video || !increasing(video.sourceTimes) || !(video.fps > 0) || !(video.duration > 0) ||
      !Number.isInteger(video.frameCount) || video.sourceTimes.length !== video.frameCount + 1 ||
      poses.length !== stateTimes.length * names.length * 7 || !poses.every(Number.isFinite)) {
    throw new Error('The saved motion data is incomplete.');
  }
  const nodes = names.map(name => {
    const node = root.getObjectByName(name);
    if (!node) throw new Error(`Missing animated body: ${name}`);
    node.matrixAutoUpdate = true;
    return node;
  });
  const from = new THREE.Quaternion(), to = new THREE.Quaternion();
  const stride = nodes.length * 7;
  let previousTime = -1;
  function setTime(time) {
    if (!Number.isFinite(time)) return;
    const clamped = Math.max(0, Math.min(video.duration, time));
    if (clamped === previousTime) return;
    previousTime = clamped;
    const [first, second, mix] = stateInterval(stateTimes, videoToStateTime(clamped, video));
    nodes.forEach((node, index) => {
      const a = first * stride + index * 7;
      const b = second * stride + index * 7;
      node.position.set(
        poses[a] + (poses[b] - poses[a]) * mix,
        poses[a + 1] + (poses[b + 1] - poses[a + 1]) * mix,
        poses[a + 2] + (poses[b + 2] - poses[a + 2]) * mix,
      );
      from.fromArray(poses, a + 3);
      to.fromArray(poses, b + 3);
      node.quaternion.slerpQuaternions(from, to, mix).normalize();
    });
  }
  setTime(0);
  return { setTime, duration: video.duration };
}

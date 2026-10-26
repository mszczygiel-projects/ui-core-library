function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/** Waits until Stencil has rendered: it schedules every render for the next animation frame. */
export async function nextRender(): Promise<void> {
  await nextFrame();
  await nextFrame();
}

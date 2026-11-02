export async function withDeadline<Settled, Late>(
  work: Promise<Settled>,
  deadlineMs: number,
  late: Late,
): Promise<Settled | Late> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<Late>((resolve) => {
    timer = setTimeout(() => resolve(late), deadlineMs);
  });
  try {
    return await Promise.race([work, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

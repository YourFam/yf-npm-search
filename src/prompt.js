import readline from 'node:readline';

export function isTty(stream) {
  return Boolean(stream && stream.isTTY);
}

export function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const finish = () => {
      try {
        rl.close();
      } catch {
        // ignore
      }
      process.exit(0);
    };

    const onSigint = () => finish();
    const onSigtstp = () => finish();

    process.once('SIGINT', onSigint);
    process.once('SIGTSTP', onSigtstp);
    rl.once('close', finish);

    rl.question(question, (answer) => {
      process.removeListener('SIGINT', onSigint);
      process.removeListener('SIGTSTP', onSigtstp);
      rl.removeListener('close', finish);
      rl.close();
      resolve(answer);
    });
  });
}

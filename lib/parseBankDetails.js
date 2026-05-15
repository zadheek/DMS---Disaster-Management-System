export function parseBankDetails(raw) {
  if (!raw || typeof raw !== "string") {
    return {
      accountName: "",
      accountNumber: "",
      bankName: "",
      branch: "",
      additional: [],
    };
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let accountName = "";
  let accountNumber = "";
  let bankName = "";
  let branch = "";
  const additional = [];

  lines.forEach((line, index) => {
    const separator = line.indexOf(":");

    if (separator === -1) {
      if (index === 0 && !accountName) {
        accountName = line;
      } else {
        additional.push(line);
      }
      return;
    }

    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (!value) return;

    if (key.includes("account") && key.includes("name")) {
      accountName = value;
      return;
    }
    if (key.includes("account") && (key.includes("no") || key.includes("number"))) {
      accountNumber = value;
      return;
    }
    if (key.includes("bank")) {
      bankName = value;
      return;
    }
    if (key.includes("branch")) {
      branch = value;
      return;
    }

    additional.push(`${line.slice(0, separator).trim()}: ${value}`);
  });

  if (!accountName && lines.length > 0) {
    accountName = lines[0];
  }

  return { accountName, accountNumber, bankName, branch, additional };
}
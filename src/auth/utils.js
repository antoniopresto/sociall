export function displayName(nameObject) {
  const { givenName, familyName } = nameObject;
  return `${givenName}${familyName ? ' ' + familyName : ''}`;
}

export function parseUrl(args = {}) {
  let query = '?';

  for (const i in args) {
    if (i === 'host') continue;
    query += `${i}=${encodeURIComponent(args[i])}&`;
  }

  query = query.replace(/&$/, '');

  return `${args.host}${query}`;
}

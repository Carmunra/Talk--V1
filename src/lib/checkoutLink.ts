export function checkoutLink(url: string, sandbox: boolean) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== (sandbox ? 'sandbox.asaas.com' : 'asaas.com') ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== '/checkoutSession/show' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      parsed.searchParams.get('id') || '',
    )
  )
    throw new Error('Não foi possível abrir o pagamento. Procure o suporte.');
  return parsed.href;
}

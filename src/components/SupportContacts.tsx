import React from 'react';

export function SupportContacts({
  config,
  fallback = 'canal pendente',
}: {
  config: { supportEmail?: string; supportEmails?: string[] };
  fallback?: string;
}) {
  const emails = config.supportEmails?.length
    ? config.supportEmails
    : config.supportEmail
      ? [config.supportEmail]
      : [];
  return (
    <>
      {emails.length
        ? emails.map((email, index) => (
            <React.Fragment key={email}>
              {index > 0 && ' | '}
              <a href={'mailto:' + email}>{email}</a>
            </React.Fragment>
          ))
        : fallback}
    </>
  );
}

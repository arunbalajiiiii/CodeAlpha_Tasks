export default function MemberBadge({ member, size = 'md', showTooltip = false }) {
  const initials = (member.displayName || member.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';

  return (
    <div
      className={`avatar ${sizeClass}`}
      style={{ background: member.avatarColor || 'var(--primary)' }}
      title={showTooltip ? (member.displayName || member.email) : undefined}
    >
      {initials}
    </div>
  );
}

export function capitalizeFirst(content: string) {
  return content
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

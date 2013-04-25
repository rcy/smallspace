slugify = function(s) {
  return s.replace(/[^\w\s]+/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase();
}

export const slugify = (text) => {
  if (!text) return '';

  let s = String(text).toLowerCase().trim();

  s = s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đ]/g, 'd')
    .replace(/[ă]/g, 'a')
    .replace(/[â]/g, 'a')
    .replace(/[ê]/g, 'e')
    .replace(/[ô]/g, 'o')
    .replace(/[ơ]/g, 'o')
    .replace(/[ư]/g, 'u')
    .replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a')
    .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
    .replace(/[íìỉĩị]/g, 'i')
    .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
    .replace(/[úùủũụưứừửữự]/g, 'u')
    .replace(/[ýỳỷỹỵ]/g, 'y')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return s;
};

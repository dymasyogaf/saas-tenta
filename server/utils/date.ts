/**
 * Mengembalikan label tanggal untuk keperluan grafik (Chart).
 * Format: "Sen, 18 Jul"
 */
export function getChartDateLabel(d: Date): string {
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`
}

/**
 * Mengembalikan Date object di awal hari (00:00:00.000)
 */
export function getStartOfDay(d: Date): Date {
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  return start
}

/**
 * Mengembalikan Date object di akhir hari (23:59:59.999)
 */
export function getEndOfDay(d: Date): Date {
  const end = new Date(d)
  end.setHours(23, 59, 59, 999)
  return end
}

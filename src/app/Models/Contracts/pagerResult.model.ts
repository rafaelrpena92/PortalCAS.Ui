export interface PagerResult<T> {
  items: T[];       // Corresponde ao 'Items' do C#
  totalRows: number; // Corresponde ao 'TotalRows' do C#
  pageNumber: number; // Corresponde ao 'PageNumber' do C#
}
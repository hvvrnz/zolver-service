import openpyxl
from pathlib import Path

class FileService:
    @staticmethod
    def generate_unique_filename(user_id: int, original_file_name: str):
        try:
            prefix = f"{user_id}_"
            if not original_file_name.startswith(prefix):
                return f"{prefix}{original_file_name}"
            return original_file_name
        except Exception as e:
            raise e
            
    @staticmethod
    def get_masked_sample(file_path: Path, safe_keywords: list, row_limit: int, col_limit: int) -> list:
        try:
            wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
            ws = wb.active
            
            masked_data = []
            for row in ws.iter_rows(max_row=row_limit, max_col=col_limit, values_only=True):
                masked_row = []
                for cell in row:
                    cell_str = str(cell).strip() if cell is not None else ""
                    is_safe = (
                        cell_str == "" or
                        any(kw in cell_str for kw in safe_keywords) or
                        (cell_str.isdigit() and len(cell_str) <= 4)
                    )
                    masked_row.append(cell_str) if is_safe else masked_row.append("[PRIVATE]")
                masked_data.append(masked_row)
            return masked_data

        except Exception as e:
            raise e
        finally:
            if 'wb' in locals() and wb: 
                wb.close()
        
      
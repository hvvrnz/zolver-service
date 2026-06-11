import shutil
import aiofiles
from pathlib import Path
from fastapi import UploadFile



class FileUtil:
    @staticmethod
    async def save_file(file: UploadFile, dst_path: Path) -> bool:
        try:
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            async with aiofiles.open(dst_path, 'wb') as out_file:
                while content := await file.read(1024 * 1024):  # 1MB 씩 분할 리드
                    await out_file.write(content)
            return True
        except Exception as e:
            raise e

    @staticmethod
    def delete_file(path: Path) -> bool:
        if not path or not path.exists():
            return False
        try:
            if path.is_file():
                path.unlink()
                return True
            return False
        except Exception as e:
            raise e
    
    @staticmethod
    def delete_dir(path: Path) -> bool:
        if not path or not path.exists():
            return False
        try:
            if path.is_dir():
                shutil.rmtree(path)
                return True
            return False
        except Exception as e:
            raise e
    

    @staticmethod
    def cleanup_memory(obj, attr_name: list): # 객체 내 데이터의 명시적 메모리 해제 수행
        try:
            for name in attr_name:
                # 객체와 데이터 사이의 Reference 끊기
                if hasattr(obj, name): 
                    delattr(obj, name) 
            # 참조 카운트가 0이 된 쓰레기 객체들을 Heap 영역에서 즉시 수거
            import gc
            gc.collect()
            return True
        except Exception as e:
            raise e
            

    @staticmethod
    def move_file(file_path: Path, dst_full_path: Path) -> bool:
        try:
            dst_full_path.parent.mkdir(parents=True, exist_ok=True)
            
            if dst_full_path.exists():
                if dst_full_path.is_dir():
                    shutil.rmtree(dst_full_path)
                else:
                    dst_full_path.unlink()
            shutil.move(str(file_path), str(dst_full_path))
            return True
        except Exception as e:
            raise e

    @staticmethod
    def is_not_hidden(path: Path) -> bool:
        try:
            return not path.name.startswith('.')
        except Exception as e:
            raise e

    @staticmethod
    def is_within_size_limit(path: Path, max_size: int) -> bool:
        try:
            if path.stat().st_size <= max_size:
                return True
            return False
        except Exception as e:
            raise e
    
    @staticmethod
    def is_valid_extension(path: Path, valid_extension: str) -> bool:
        try:
            if path.suffix.lower() == valid_extension.lower():
                return True
            return False
        except Exception as e:
            raise e
   
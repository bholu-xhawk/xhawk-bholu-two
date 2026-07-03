import json
import os
from threading import Lock
from typing import Dict, List, Optional


class TodoStore:
    def __init__(self, path: Optional[str] = None) -> None:
        self.path = path or os.getenv("TODO_FILE", "app/todos.json")
        self._lock = Lock()
        self._ensure_file()

    def _ensure_file(self) -> None:
        if not os.path.exists(self.path):
            os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump({"next_id": 1, "todos": []}, f)

    def _read(self) -> Dict:
        with open(self.path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write(self, data: Dict) -> None:
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(data, f)

    def list(self) -> List[Dict]:
        with self._lock:
            data = self._read()
            return data.get("todos", [])

    def add(self, title: str) -> Dict:
        with self._lock:
            data = self._read()
            todo = {"id": data.get("next_id", 1), "title": title, "completed": False}
            data.setdefault("todos", []).append(todo)
            data["next_id"] = todo["id"] + 1
            self._write(data)
            return todo

    def update(self, todo_id: int, *, title: Optional[str] = None, completed: Optional[bool] = None) -> Dict:
        with self._lock:
            data = self._read()
            todos = data.get("todos", [])
            for t in todos:
                if t["id"] == todo_id:
                    if title is not None:
                        t["title"] = title
                    if completed is not None:
                        t["completed"] = bool(completed)
                    self._write(data)
                    return t
            raise KeyError(todo_id)

    def delete(self, todo_id: int) -> None:
        with self._lock:
            data = self._read()
            todos = data.get("todos", [])
            new_todos = [t for t in todos if t["id"] != todo_id]
            if len(new_todos) == len(todos):
                raise KeyError(todo_id)
            data["todos"] = new_todos
            self._write(data)

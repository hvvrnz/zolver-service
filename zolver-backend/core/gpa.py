GPA_MAP = {
    'A+': 4.5, 'A': 4.0, 'B+': 3.5, 'B': 3.0,
    'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0
}

def calc_gpa(lectures):
    valid = [
        l for l in lectures
        if not l.get("delete_type")
        and l.get("course_grade")
        and l["course_grade"] not in ["N", "NP"]
        and l["course_grade"] in GPA_MAP
    ]
    pts = sum(GPA_MAP[l["course_grade"]] * (l["lecture_credit"] or 0) for l in valid)
    crd = sum(l["lecture_credit"] or 0 for l in valid)
    if crd == 0:
        return None
    return int((pts / crd) * 100) / 100
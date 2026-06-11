from quality.transcript.validator.l1_physical.validator import L1FileValidator
from quality.transcript.validator.l2_content.validator import L2TranscriptValidator

TRANSCRIPT_VALIDATORS = [
    L1FileValidator,
    L2TranscriptValidator
]
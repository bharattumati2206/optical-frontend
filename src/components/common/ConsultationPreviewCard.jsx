import PropTypes from "prop-types";
import { Alert, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ConsultationPreviewCard({ loading, preview }) {
  if (loading) {
    return (
      <Alert severity="info" icon={<CircularProgress size={16} />}>
        Checking follow-up eligibility...
      </Alert>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 1.5 }}>
        <Stack spacing={1}>
          <Alert severity={preview.severity}>{preview.message}</Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Typography variant="caption">Last visit: {formatDate(preview.lastVisitDate)}</Typography>
            <Typography variant="caption">Days since last visit: {preview.daysSinceLastVisit ?? "-"}</Typography>
            <Typography variant="caption">Effective fee now: Rs {preview.effectiveFee}</Typography>
            <Typography variant="caption">Follow-up valid until: {formatDate(preview.followupValidUntil)}</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

ConsultationPreviewCard.propTypes = {
  loading: PropTypes.bool,
  preview: PropTypes.shape({
    severity: PropTypes.oneOf(["success", "warning", "info", "error"]).isRequired,
    message: PropTypes.string.isRequired,
    lastVisitDate: PropTypes.string,
    daysSinceLastVisit: PropTypes.number,
    effectiveFee: PropTypes.number.isRequired,
    followupValidUntil: PropTypes.string,
  }),
};

ConsultationPreviewCard.defaultProps = {
  loading: false,
  preview: null,
};

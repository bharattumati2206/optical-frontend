import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { createEmptyInvoiceItem } from "../../utils/invoice";

const ITEM_TYPE_ORDER = ["FRAME", "LENS", "ACCESSORY"];

const POPULAR_NAMES = {
  FRAME: ["Ray-Ban Wayfarer", "Vogue VO5230", "Oakley Holbrook"],
  LENS: ["Crizal Blue Cut", "Zeiss DriveSafe", "Essilor Eyezen"],
};

const ITEM_TYPE_META = {
  FRAME: {
    label: "Frames",
    fieldLabel: "Frame Name",
    addButtonLabel: "Add Another Frame",
    accent: "#5A5CF6",
    soft: "#EEF0FF",
    chipBg: "#DCE1FF",
  },
  LENS: {
    label: "Lens",
    fieldLabel: "Lens Name",
    addButtonLabel: "Add Lens",
    accent: "#0EA47A",
    soft: "#E8FAF4",
    chipBg: "#D2F4EA",
  },
  ACCESSORY: {
    label: "Accessories",
    fieldLabel: "Accessory Name",
    addButtonLabel: "Add Accessory",
    accent: "#5A5CF6",
    soft: "#F4F5FB",
    chipBg: "#E6E8F8",
  },
};

export default function InvoiceItemsEditor({
  items,
  setItems,
  itemErrors = {},
  setItemErrors,
}) {
  const handleChange = (index, field, value, options = {}) => {
    const { clearFieldError = true } = options;

    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );

    if (clearFieldError && setItemErrors && itemErrors[index]?.[field]) {
      setItemErrors((prev) => {
        const rowErrors = prev[index] ? { ...prev[index] } : {};
        delete rowErrors[field];

        if (Object.keys(rowErrors).length === 0) {
          const next = { ...prev };
          delete next[index];
          return next;
        }

        return { ...prev, [index]: rowErrors };
      });
    }
  };

  const handleUnitPriceFocus = (index, value) => {
    if (Number(value) !== 0 || String(value).trim() === "") {
      return;
    }

    handleChange(index, "unitPrice", "", { clearFieldError: false });
  };

  const handleQuantityStep = (index, delta) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const currentValue = Number(item.quantity) || 0;
        const nextValue = Math.max(1, currentValue + delta);
        return { ...item, quantity: nextValue };
      }),
    );
  };

  const handleAdd = (type = "FRAME") => {
    setItems((prev) => [...prev, createEmptyInvoiceItem(type)]);
  };

  const handleRemove = (index) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handlePopularNameSelect = (index, itemType, name) => {
    handleChange(index, "itemType", itemType);
    handleChange(index, "name", name);
  };

  const getPopularNameClickHandler = (index, itemType, name) =>
    handlePopularNameSelect.bind(null, index, itemType, name);

  const groupedItems = useMemo(
    () =>
      ITEM_TYPE_ORDER.map((type) => ({
        type,
        items: items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => (item.itemType || "FRAME") === type),
      })),
    [items],
  );

  return (
    <Stack spacing={2}>
      {groupedItems.map(({ type, items: entries }) => {
        const meta = ITEM_TYPE_META[type];

        return (
          <Paper
            key={type}
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              borderColor: "#E3E8F1",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1.2}
              sx={{
                px: 2,
                py: 1.5,
                backgroundColor: meta.soft,
                borderLeft: `4px solid ${meta.accent}`,
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: meta.chipBg,
                    color: meta.accent,
                  }}
                >
                  <CategoryRoundedIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Typography fontWeight={700} color="#27304B">
                  {meta.label}
                </Typography>
                <Chip
                  size="small"
                  label={`${entries.length} ${entries.length === 1 ? "Item" : "Items"}`}
                  sx={{
                    bgcolor: meta.chipBg,
                    color: meta.accent,
                    fontWeight: 700,
                  }}
                />
              </Stack>

              <Button
                size="small"
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => handleAdd(type)}
                sx={{
                  borderColor: meta.accent,
                  color: meta.accent,
                  "&:hover": {
                    borderColor: meta.accent,
                    backgroundColor: meta.chipBg,
                  },
                }}
              >
                {meta.addButtonLabel}
              </Button>
            </Stack>

            <Stack spacing={1.5} sx={{ p: 2 }}>
              {entries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No {meta.label.toLowerCase()} added yet.
                </Typography>
              ) : null}

              {entries.map(({ item, index }, rowIndex) => (
                <Grid
                  id={`order-item-row-${index}`}
                  container
                  spacing={1.5}
                  key={`${item.itemType}-${index}`}
                  alignItems="flex-start"
                >
                  <Grid size={{ xs: 12, md: 0.7 }}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        mt: 1.3,
                        bgcolor: meta.chipBg,
                        color: meta.accent,
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {rowIndex + 1}
                    </Avatar>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4.1 }}>
                    <TextField
                      id={`order-item-${index}-name`}
                      fullWidth
                      label={meta.fieldLabel}
                      required
                      value={item.name}
                      onChange={(event) =>
                        handleChange(index, "name", event.target.value)
                      }
                      error={Boolean(itemErrors[index]?.name)}
                      helperText={itemErrors[index]?.name || " "}
                    />
                    {POPULAR_NAMES[type]?.length ? (
                      <Stack
                        direction="row"
                        spacing={0.8}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 0.5, ml: 0.2 }}
                      >
                        {POPULAR_NAMES[type].map((name) => (
                          <Chip
                            key={`${type}-${index}-${name}`}
                            size="small"
                            label={name}
                            onClick={getPopularNameClickHandler(
                              index,
                              type,
                              name,
                            )}
                            variant="outlined"
                            sx={{
                              borderColor: meta.chipBg,
                              color: meta.accent,
                              bgcolor: "#fff",
                              "&:hover": { bgcolor: meta.soft },
                            }}
                          />
                        ))}
                      </Stack>
                    ) : null}
                  </Grid>

                  <Grid size={{ xs: 12, md: 2.8 }}>
                    <TextField
                      id={`order-item-${index}-unitPrice`}
                      fullWidth
                      type="text"
                      label="Unit Price (₹)"
                      required
                      value={item.unitPrice}
                      onChange={(event) =>
                        handleChange(index, "unitPrice", event.target.value)
                      }
                      onFocus={() =>
                        handleUnitPriceFocus(index, item.unitPrice)
                      }
                      slotProps={{
                        htmlInput: { min: 0.01, step: "0.01" },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        },
                      }}
                      error={Boolean(itemErrors[index]?.unitPrice)}
                      helperText={itemErrors[index]?.unitPrice || " "}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <Stack spacing={0.8}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#5E6A84", fontWeight: 600, pl: 0.4 }}
                      >
                        Quantity
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        sx={{
                          border: "1px solid #D3DAE8",
                          borderRadius: 1.2,
                          width: "fit-content",
                          overflow: "hidden",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityStep(index, -1)}
                          sx={{ borderRadius: 0, px: 1.1 }}
                        >
                          <RemoveRoundedIcon fontSize="small" />
                        </IconButton>
                        <Box
                          sx={{
                            px: 1.8,
                            py: 0.55,
                            minWidth: 30,
                            textAlign: "center",
                            fontWeight: 600,
                          }}
                        >
                          {Number(item.quantity) || 1}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityStep(index, 1)}
                          sx={{ borderRadius: 0, px: 1.1 }}
                        >
                          <AddRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      {itemErrors[index]?.quantity ? (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ pl: 0.4 }}
                        >
                          {itemErrors[index]?.quantity}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 1 }}>
                    <Stack
                      alignItems={{ xs: "flex-end", md: "center" }}
                      justifyContent="center"
                      height="100%"
                      pt={{ md: 1.4 }}
                    >
                      <IconButton
                        color="error"
                        onClick={() => handleRemove(index)}
                        disabled={items.length === 1}
                        sx={{
                          border: "1px solid #F9D2D2",
                          backgroundColor: "#FFF2F2",
                        }}
                      >
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Stack>
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}

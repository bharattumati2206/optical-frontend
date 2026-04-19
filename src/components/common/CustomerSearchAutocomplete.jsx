import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { customerService } from "../../services/customerService";
import { getListData } from "../../utils/api";

const DEFAULT_DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 1;

function buildSearchParams(rawQuery) {
  const query = String(rawQuery || "").trim();

  if (!query) {
    return {};
  }

  const isDigitsOnly = /^\d+$/.test(query);

  if (isDigitsOnly) {
    return { phone: query }; // Search by phone if input is digits only
  }

  return { name: query }; // Otherwise, search by name
}

function mapCustomerOptions(payload) {
  return getListData(payload).map((item) => ({
    id: item.id,
    name: item.name || item.customerName || "",
    phone: item.phone || item.mobile || "",
  }));
}

export default function CustomerSearchAutocomplete({
  value,
  onChange,
  label = "Search Customer",
  placeholder = "Type name or phone",
  debounceMs = DEFAULT_DEBOUNCE_MS,
  disabled = false,
  textFieldProps = {},
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!value) {
      return;
    }

    const display = [value.name, value.phone].filter(Boolean).join(" - ");
    setInputValue(display);
  }, [value]);

  useEffect(() => {
    const query = inputValue.trim();

    // Prevent unnecessary API call if inputValue matches the selected customer's display value
    if (value && query === [value.name, value.phone].filter(Boolean).join(" - ")) {
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timerId = setTimeout(async () => {
      setLoading(true);

      try {
        const data = await customerService.getCustomers(buildSearchParams(query));

        if (requestIdRef.current === requestId) {
          setOptions(mapCustomerOptions(data));
        }
      } catch {
        if (requestIdRef.current === requestId) {
          setOptions([]);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timerId);
    };
  }, [debounceMs, inputValue, value]); // Added 'value' as a dependency

  return (
    <Autocomplete
      options={options}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, nextValue) => {
        setInputValue(nextValue);
      }}
      onChange={(_, nextValue) => {
        onChange(nextValue || null);
        if (!nextValue) {
          setInputValue("");
        }
      }}
      disabled={disabled}
      loading={loading}
      filterOptions={(x) => x}
      isOptionEqualToValue={(option, selected) => option.id === selected?.id}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          return option;
        }
        return [option.name, option.phone].filter(Boolean).join(" - ");
      }}
      noOptionsText={inputValue.trim() ? "No customers found" : "Type name or phone"}
      renderInput={(params) => (
        <TextField
          {...params}
          {...textFieldProps}
          size={textFieldProps.size || "small"}
          label={label}
          placeholder={placeholder}
          slotProps={{
            ...textFieldProps.slotProps,
            input: {
              ...(textFieldProps.slotProps?.input || {}),
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}

CustomerSearchAutocomplete.propTypes = {
  debounceMs: PropTypes.number,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  textFieldProps: PropTypes.object,
  value: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    phone: PropTypes.string,
  }),
};

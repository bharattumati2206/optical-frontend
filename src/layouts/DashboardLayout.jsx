import {
  AppBar,
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Button,
  Select,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import PropTypes from "prop-types";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import { useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import { NavLink, Outlet, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useStore } from "../context/useStore";

const drawerWidth = 260;

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: <DashboardRoundedIcon /> },
  { label: "Customers", to: "/customers", icon: <Groups2RoundedIcon /> },
  { label: "Consultations", to: "/consultations", icon: <LocalHospitalRoundedIcon /> },
  { label: "Orders", to: "/orders", icon: <ReceiptLongRoundedIcon /> },
];

function SidebarContent({ onNavigate }) {
  return (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ px: 2.5, py: 2.2 }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main" }}>
            <StoreRoundedIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              Optical Admin
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Multi-Store Billing
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider />

      <List sx={{ px: 1.3, py: 1.5 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={onNavigate}
            sx={{
              mb: 0.5,
              borderRadius: 2,
              color: "text.secondary",
              "&.active": {
                bgcolor: "#eef1ff",
                color: "primary.main",
                "& .MuiListItemIcon-root": {
                  color: "primary.main",
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{ primary: { fontWeight: 600 } }}
            />
          </ListItemButton>
        ))}
      </List>

      <Stack spacing={1} sx={{ px: 2, mt: "auto", pb: 2 }}>
        <Button
          component={RouterLink}
          to="/orders/new"
          variant="contained"
          startIcon={<AddRoundedIcon />}
        >
          New Order
        </Button>
        <Button
          component={RouterLink}
          to="/customers/new"
          variant="outlined"
          startIcon={<PersonAddAltRoundedIcon />}
        >
          New Customer
        </Button>
      </Stack>
    </Stack>
  );
}

SidebarContent.propTypes = {
  onNavigate: PropTypes.func,
};

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { stores, selectedStore, loadingStores, storeError, isSuperAdmin, selectStore } = useStore();

  const handleStoreChange = (event) => {
    const nextStoreId = String(event.target.value);
    const selectedStoreObj = stores.find((store) => String(store.id) === nextStoreId);
    if (selectedStoreObj) {
      selectStore(selectedStoreObj);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ fontSize: { xs: "1.05rem", md: "1.15rem" } }}
            >
              Optical Billing Dashboard
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.2} alignItems="center">
            {isSuperAdmin ? (
              <FormControl size="small" sx={{ minWidth: 170, maxWidth: 200 }}>
                <InputLabel id="header-store-select-label">Store</InputLabel>
                <Select
                  labelId="header-store-select-label"
                  label="Store"
                  displayEmpty
                  value={selectedStore?.id ? String(selectedStore.id) : ""}
                  onChange={handleStoreChange}
                  disabled={loadingStores || !stores.length}
                  inputProps={{ "aria-label": "Store" }}
                >
                  <MenuItem value="" disabled>
                    Select Store
                  </MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={String(store.id)}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {user?.email || "Staff"}
            </Typography>
            <IconButton onClick={logout} color="inherit" title="Logout">
              <LogoutRoundedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          <SidebarContent onNavigate={() => setOpen(false)} />
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid #eaecf0",
            },
          }}
          open
        >
          <SidebarContent />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          p: { xs: 2, md: 3 },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>

      {isSuperAdmin && !selectedStore ? (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(247, 249, 252, 0.78)",
            backdropFilter: "blur(2px)",
            p: 2,
          }}
        >
          <Card sx={{ width: "100%", maxWidth: 460, boxShadow: 8 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" textAlign="center">
                  Select Store
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  Choose a store to continue to dashboard.
                </Typography>
                {loadingStores ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Loading stores...
                    </Typography>
                  </Stack>
                ) : null}
                {!loadingStores && storeError ? (
                  <Alert severity="warning">{storeError}</Alert>
                ) : null}
                <FormControl fullWidth size="small">
                  <InputLabel id="gate-store-select-label">Store</InputLabel>
                  <Select
                    labelId="gate-store-select-label"
                    label="Store"
                    value={selectedStore?.id ? String(selectedStore.id) : ""}
                    onChange={handleStoreChange}
                    disabled={loadingStores || !stores.length}
                    autoFocus
                  >
                    <MenuItem value="" disabled>
                      Select Store
                    </MenuItem>
                    {stores.map((store) => (
                      <MenuItem key={store.id} value={String(store.id)}>
                        {store.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      ) : null}
    </Box>
  );
}

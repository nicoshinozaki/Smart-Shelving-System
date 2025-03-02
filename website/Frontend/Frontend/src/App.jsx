import React, {useState,useEffect} from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Desktop } from "./screens/Desktop";
import { DesktopData } from "./screens/DesktopData";
import { DesktopLogin } from "./screens/DesktopLogin";
import { Mobile } from "./screens/Mobile";
import { MobileData } from "./screens/MobileData";
import { MobileLogin } from "./screens/MobileLogin";
import { Tablet } from "./screens/Tablet";
import { TabletData } from "./screens/TabletData";
import { TabletLogin } from "./screens/TabletLogin";
import { DesktopAdmin } from "./screens/DesktopAdmin";
const isAuthenticated = () => {
  return !!localStorage.getItem("token"); 
};

const router = createBrowserRouter([
  {
    path: "/*",
    element: <Desktop />,
  },
  {
    path: "/desktop-admin",
    element: <DesktopAdmin />,
  },
  {
    path: "/desktop-data",
    element: <DesktopData />,
  },
  {
    path: "/mobile-data",
    element: <MobileData />,
  },
  {
    path: "/tablet-data",
    element: <TabletData />,
  },
  {
    path: "/desktop",
    element: <Desktop />,
  },
  {
    path: "/tablet",
    element: <Tablet />,
  },
  {
    path: "/mobile-login",
    element: <MobileLogin />,
  },
  {
    path: "/desktop-login",
    element: <DesktopLogin />,
  },
  {
    path: "/mobile",
    element: <Mobile />,
  },
  {
    path: "/tablet-login",
    element: <TabletLogin />,
  },
  
]);

export const App = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('https://localhost:8080/api/items')
    .then((response) => {
      if (!response.ok) {
        // Handle non-200 HTTP status
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json(); // Parse JSON
    })
    .then((jsonData) => {
      setData(jsonData);
    })
    .catch((error) => {
      console.error('Fetch error:', error);
    });
}, []);

  return <RouterProvider router={router} />;
};

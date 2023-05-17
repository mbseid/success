import React from "react";
import { Outlet } from "react-router-dom";

import { LinkList } from './list'

export const Links = () => {
    return (
        <div>
            <Outlet />
        </div>
    )
}
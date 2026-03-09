import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '../Layout';
import AICampusAssistant from '../AICampusAssistant';

const AppLayout = () => {
    return (
        <Layout>
            <Outlet />
            <AICampusAssistant />
        </Layout>
    );
};

export default AppLayout;

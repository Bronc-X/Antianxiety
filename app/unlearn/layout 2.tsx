import UnlearnAppLayoutClient from './layout-client';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <UnlearnAppLayoutClient>{children}</UnlearnAppLayoutClient>;
}

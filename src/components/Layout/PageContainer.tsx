interface PageContainerProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export default function PageContainer({ children, fullWidth = false, className = "" }: PageContainerProps) {
  if (fullWidth) {
    return <div className={className} style={{ width: "100%", height: "100%" }}>{children}</div>;
  }

  return (
    <div className={className} style={{ width: "100%", minHeight: "100%" }}>
      <div style={{
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: 48,
        paddingRight: 48,
        paddingTop: 40,
        paddingBottom: 80,
      }}>
        {children}
      </div>
    </div>
  );
}

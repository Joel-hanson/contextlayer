'use client';

import { OpenAPIImportDialogUI } from './OpenAPIImportDialogUI';
import { type OpenAPIImportData } from './use-openapi-import-dialog';

interface OpenAPIImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (result: OpenAPIImportData) => void;
}

export function OpenAPIImportDialog({ open, onOpenChange, onImport }: OpenAPIImportDialogProps) {
    return (
        <OpenAPIImportDialogUI
            open={open}
            onOpenChange={onOpenChange}
            onImport={onImport}
        />
    );
}

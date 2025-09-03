'use client';

import { useToast } from '@/hooks/use-toast';
import { BridgeConfig } from '@/lib/types';
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { ConfirmationDialog } from '../ConfirmationDialog';

// Import refactored components and hooks
import { BridgeFormUI } from './BridgeFormUI';
import { useBridgeForm } from './use-bridge-form';
import { createDefaultAccessToken, transformFormDataToBridgeConfig } from './utils/bridge-form-actions';
import { McpBridgeFormData } from './utils/types';

interface BridgeFormProps {
    bridge?: BridgeConfig;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (bridge: BridgeConfig) => Promise<void>;
    onDelete?: (bridgeId: string) => void;
}

export function BridgeForm({ bridge, open, onOpenChange, onSave, onDelete }: BridgeFormProps) {
    // Confirmation dialog state for delete operation
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const { toast } = useToast();

    // Use the custom hook for form state management
    const {
        form,
        activeTab,
        setActiveTab,
        hasUnsavedChanges,
        showGuide,
        setShowGuide,
        submitError,
        setSubmitError,
        isSubmitting,
        setIsSubmitting,
        endpointFields,
        showLoadDraftDialog,
        setShowLoadDraftDialog,
        showCloseDialog,
        setShowCloseDialog,
        handleClose,
        handleLoadDraftConfirm,
        handleCloseConfirm,
        handleFormSuccess,
    } = useBridgeForm({
        bridge,
        open,
        onOpenChange,
        onSave,
    });

    // Handle form submission
    const handleSubmit: SubmitHandler<McpBridgeFormData> = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Transform form data to bridge config
            const bridgeConfig = transformFormDataToBridgeConfig(data, bridge);

            // Save bridge
            await onSave(bridgeConfig);

            // Create default token for new bridges with auth required
            if (!bridge && data.access?.requiresAuthentication) {
                const result = await createDefaultAccessToken(bridgeConfig.id, data.name);
                toast({
                    title: "Bridge Created",
                    description: result.message,
                    variant: result.success ? "default" : "destructive",
                });
            }

            // Clear form and close
            handleFormSuccess();
        } catch (error: unknown) {
            console.error('Error saving bridge:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to save bridge. Please check your configuration and try again.';
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        setShowDeleteDialog(false);
        if (bridge && onDelete) {
            onDelete(bridge.id);
        }
    };

    return (
        <>
            {/* Main Form UI */}
            <BridgeFormUI
                form={form}
                bridge={bridge}
                open={open}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                showGuide={showGuide}
                setShowGuide={setShowGuide}
                submitError={submitError}
                isSubmitting={isSubmitting}
                endpointFields={endpointFields}
                hasUnsavedChanges={hasUnsavedChanges}
                onClose={handleClose}
                onSubmit={handleSubmit}
                onDelete={bridge && onDelete ? handleDeleteClick : undefined}
            />

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                open={showLoadDraftDialog}
                onOpenChange={setShowLoadDraftDialog}
                onConfirm={handleLoadDraftConfirm}
                title="Load Draft Data"
                description="Found unsaved draft data. Would you like to restore it?"
                confirmText="Load Draft"
                cancelText="Discard"
            />

            <ConfirmationDialog
                open={showCloseDialog}
                onOpenChange={setShowCloseDialog}
                onConfirm={handleCloseConfirm}
                title="Unsaved Changes"
                description="You have unsaved changes. Are you sure you want to close without saving?"
                confirmText="Close Anyway"
                cancelText="Keep Editing"
            />

            <ConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteConfirm}
                title="Delete MCP Server"
                description="Are you sure you want to delete this MCP server? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </>
    );
}


import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function ChangePassword() {
    const navigate = useNavigate()

    const [
        currentPassword,
        setCurrentPassword,
    ] = useState('')

    const [
        newPassword,
        setNewPassword,
    ] = useState('')

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState('')

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [saving, setSaving] = useState(false)

    const submit = async (e) => {
        e.preventDefault()

        setError('')
        setSuccess('')

        if (newPassword.length < 6) {
            setError(
                'New password must be at least 6 characters.'
            )
            return
        }

        if (newPassword !== confirmPassword) {
            setError(
                'New password and confirm password do not match.'
            )
            return
        }

        if (
            currentPassword === newPassword
        ) {
            setError(
                'New password must be different from current password.'
            )
            return
        }

        setSaving(true)

        try {
            await api(
                '/auth/change-password',
                {
                    method: 'POST',
                    body: {
                        currentPassword,
                        newPassword,
                    },
                }
            )

            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

            setSuccess(
                'Password changed successfully.'
            )
        } catch (e) {
            setError(
                e.message ||
                'Failed to change password.'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="card"
            style={{
                maxWidth: 520,
                margin: '0 auto',
            }}
        >
            <h2>Change Password</h2>

            <p className="muted">
                Enter your current password and
                choose a new password.
            </p>

            {success ? (
                <div
                    style={{
                        padding: '14px 16px',
                        marginTop: 16,
                        marginBottom: 16,
                        borderRadius: 10,
                        background: '#dcfce7',
                        color: '#166534',
                        border: '1px solid #86efac',
                        fontWeight: 500,
                    }}
                >
                    {success}
                </div>
            ) : (
                <>
                    {error && (
                        <div
                            style={{
                                padding: '14px 16px',
                                marginTop: 16,
                                marginBottom: 16,
                                borderRadius: 10,
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                                fontWeight: 500,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={submit}
                        className="form"
                    >
                        <label>
                            Current password

                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(
                                        e.target.value
                                    )
                                }
                                autoComplete="current-password"
                                required
                            />
                        </label>

                        <label>
                            New password

                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(
                                        e.target.value
                                    )
                                }
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                        </label>

                        <label>
                            Confirm new password

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                        </label>

                        <div className="row-form">
                            <button
                                type="submit"
                                disabled={
                                    saving ||
                                    !currentPassword ||
                                    !newPassword ||
                                    !confirmPassword
                                }
                            >
                                {saving
                                    ? 'Changing...'
                                    : 'Change password'}
                            </button>

                            <button
                                type="button"
                                className="ghost"
                                onClick={() =>
                                    navigate(-1)
                                }
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    )
}

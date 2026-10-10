import { useState } from 'react'

/*
  Password box with a show / hide button (eye icon).
  Use it exactly like <input>: value, onChange, placeholder, required ...
*/
export default function PasswordInput(props) {
  const [show, setShow] =
    useState(false)

  return (
    <span className="pass-field">
      <input
        {...props}
        type={
          show
            ? 'text'
            : 'password'
        }
      />

      <button
        type="button"
        className="pass-toggle"
        onClick={() =>
          setShow(
            (current) =>
              !current
          )
        }
        aria-label={
          show
            ? 'Hide password'
            : 'Show password'
        }
        aria-pressed={show}
        title={
          show
            ? 'Hide password'
            : 'Show password'
        }
      >
        {show ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </span>
  )
}

import { beginRequest, toast } from './effects'

const BASE =
  import.meta.env.VITE_API_URL
  || 'http://localhost:5000/api'

// Requests that should not pop up a "Done" message
// (they have their own feedback on the page, or are background work)
const QUIET = [
  /^\/auth\//,
  /^\/notifications/,
  /^\/attendance\/scan/,
  /^\/payments\/razorpay\//,
]

const DONE = {
  POST: 'Done',
  PUT: 'Saved',
  PATCH: 'Updated',
  DELETE: 'Deleted',
}

export async function api(
  path,
  { method = 'GET', body } = {}
) {
  const token = localStorage.getItem('token')

  const quiet =
    method === 'GET' ||
    QUIET.some((rx) => rx.test(path))

  const end = beginRequest()
  // starts the button spinner and the loading bar

  try {
    let res

    try {
      const isFormData =
        body instanceof FormData

      const headers = {
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      }

      if (!isFormData) {
        headers['Content-Type'] =
          'application/json'
      }

      res = await fetch(BASE + path, {
        method,
        headers,
        body: body
          ? isFormData
            ? body
            : JSON.stringify(body)
          : undefined,
      })
    } catch {
      throw new Error(
        'Cannot reach the server. Please check your internet and try again.'
      )
    }

    const data = await res
      .json()
      .catch(() => ({}))

    if (!res.ok) {
      throw new Error(
        data.message || 'Request failed'
      )
    }

    if (!quiet) {
      toast(
        'success',
        data.message ||
          DONE[method] ||
          'Done'
      )
    }

    return data
  } catch (err) {
    if (!quiet) {
      toast('error', err.message)
    }

    throw err
  } finally {
    end()
  }
}

// Dates are stored as UTC midnight,
// so always format in UTC
export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(
        'en-IN',
        {
          timeZone: 'UTC',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
    : '-'

export const todayISO = () =>
  new Date(
    Date.now() + 330 * 60000
  )
    .toISOString()
    .slice(0, 10)

export const rupees = (n) =>
  '₹' +
  Number(n || 0).toLocaleString('en-IN')

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString(
        'en-IN',
        {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }
      )
    : '-'

export const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString(
        'en-IN',
        {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
        }
      )
    : '-'

export const fmtMins = (m) =>
  `${Math.floor(
    (m || 0) / 60
  )}h ${String(
    (m || 0) % 60
  ).padStart(2, '0')}m`

export const thisMonth = () =>
  new Date(
    Date.now() + 330 * 60000
  )
    .toISOString()
    .slice(0, 7)

// Files behind login (receipts, CSV, Excel, PDF, backup):
// fetch with the token, then save as a file.
// The button shows a spinner while it downloads.
async function saveAs(
  path,
  filename,
  failText
) {
  const end = beginRequest()

  try {
    let res

    try {
      res = await fetch(BASE + path, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            'token'
          )}`,
        },
      })
    } catch {
      throw new Error(
        'Cannot reach the server. Please check your internet and try again.'
      )
    }

    if (!res.ok) {
      throw new Error(failText)
    }

    const url = URL.createObjectURL(
      await res.blob()
    )

    const a =
      document.createElement('a')

    a.href = url
    a.download = filename
    a.click()

    setTimeout(
      () =>
        URL.revokeObjectURL(url),
      10000
    )

    toast(
      'success',
      'Download started'
    )
  } catch (err) {
    toast('error', err.message)
    throw err
  } finally {
    end()
  }
}

// Receipts are PDFs behind login,
// so fetch with the token and download as a file
export async function downloadReceipt(
  id,
  name = 'receipt'
) {
  const token =
    localStorage.getItem('token')

  const res = await fetch(
    `${BASE}/payments/${id}/receipt`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!res.ok) {
    const contentType =
      res.headers.get('content-type') ||
      ''

    let message = `Receipt request failed (${res.status})`

    if (
      contentType.includes(
        'application/json'
      )
    ) {
      const data = await res
        .json()
        .catch(() => ({}))

      message =
        data.message || message
    } else {
      const text = await res
        .text()
        .catch(() => '')

      if (text) {
        message = text.slice(0, 300)
      }
    }

    throw new Error(message)
  }

  const blob = await res.blob()

  if (
    !blob.size ||
    blob.type !== 'application/pdf'
  ) {
    throw new Error(
      'Server did not return a valid PDF receipt'
    )
  }

  const url =
    URL.createObjectURL(blob)

  const a =
    document.createElement('a')

  a.href = url
  a.download = `${name}.pdf`

  document.body.appendChild(a)

  a.click()
  a.remove()

  setTimeout(
    () => URL.revokeObjectURL(url),
    10000
  )
}

export const downloadFile = (
  path,
  filename
) =>
  saveAs(
    path,
    filename,
    'Download failed'
  )
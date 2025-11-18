import mongoose from 'mongoose'

/**
 * Execute a function within a database transaction
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function withTransaction<T>(
  callback: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const result = await callback(session)
    await session.commitTransaction()
    return result
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Execute multiple operations atomically
 * Useful for operations that need to succeed or fail together
 */
export async function executeTransaction<T>(
  operations: Array<(session: mongoose.ClientSession) => Promise<any>>
): Promise<T[]> {
  return withTransaction(async (session) => {
    const results = await Promise.all(
      operations.map((op) => op(session))
    )
    return results as T[]
  })
}


pub mod models;
pub mod detector;
pub mod feed;
pub mod ffi;

use pyo3::prelude::*;

#[pymodule]
fn rust_engine(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<ffi::RustEngine>()?;
    Ok(())
}

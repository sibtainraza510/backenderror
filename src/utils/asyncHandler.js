const asyncHandler = (requestHandler) =>{
    return (error,req,res,next)=>{
        Promise.resolve(requestHandler(error,req,res,next))
        .catch((error)=>{
            next(error)


        })
    }
}

export default asyncHandler


